import numpy as np
from scipy import misc
from tqdm import trange

target = misc.imread('../images/lenna.png', True) / 255.0
shp = target.shape

radius = 4
W = np.eye(shp[0], shp[1])
for i in range(1, radius+1):
    W += np.eye(shp[0], shp[1], k=i) + np.eye(shp[0], shp[1], k=-i)

misc.imsave('./output/output_target.png', target)
misc.imsave('./output/cropped_target.png', W * target)

# Iterative method (Lee and Seung [1999])
a = np.random.rand(shp[0], 1)
b = np.random.rand(shp[1], 1)

for i in trange(10):
    a = a * (target @ b) / (a @ b.T @ b)
    b = b * (target.T @ a) / (b @ a.T @ a)

misc.imsave('./output/output_iterative.png', a @ b.T)
misc.imsave('./output/a_iterative.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_iterative.png', np.ones(a.shape) @ b.T)

misc.imsave('./output/cropped_iterative.png', W * (a @ b.T))

# Iterative weighted method (Blondel et al. [2008])
a = np.random.rand(shp[0], 1)
b = np.random.rand(shp[1], 1)

for i in trange(10):
    a = a * ((W * target) @ b) / ((W * (a @ b.T)) @ b)
    b = b * ((W.T * target.T) @ a) / ((W.T * (b @ a.T)) @ a)

misc.imsave('./output/output_weighted.png', a @ b.T)
misc.imsave('./output/a_weighted.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_weighted.png', np.ones(a.shape) @ b.T)

misc.imsave('./output/cropped_weighted.png', W * (a @ b.T))

# Eigenvector method
H1 = target @ target.T
H2 = target.T @ target

eigenvalues, eigenvectors = np.linalg.eigh(H1)
a = eigenvectors[:,-1][np.newaxis].T

eigenvalues, eigenvectors = np.linalg.eigh(H2)
b = eigenvectors[:,-1][np.newaxis].T

misc.imsave('./output/H1.png', H1)
misc.imsave('./output/H2.png', H2)

misc.imsave('./output/output_eigenvector.png', a @ b.T)
misc.imsave('./output/a_eigenvector.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_eigenvector.png', np.ones(a.shape) @ b.T)